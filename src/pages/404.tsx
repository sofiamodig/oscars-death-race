import Image from "next/image";
import gif from "../assets/images/notfound.gif";

const NotFound = () => {
  return (
    <div className="flex flex-col justify-center items-center mt-12 mb-12">
      <h1 className="heading text-3xl !mb-2">
        Oh no!
      </h1>
      <p className=" !mb-8 text-center">
        The page you were looking for cannot be found.
      </p>
      <div className="w-[95%] max-w-[600px] [&_img]:h-auto [&_img]:w-full">
        <Image
          src={gif}
          alt="People at the oscars being confused because they announced the wrong movie as the winner"
        />
      </div>
    </div>
  );
};

export default NotFound;
